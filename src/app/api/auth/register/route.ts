import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { parseBody, ok, fail } from "@/lib/proxy";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(150),
  email: z.string().email("Enter a valid email address."),
  phone: z.preprocess(
    (value) => normalizePhone(value),
    z.string().regex(/^\+?\d{10,15}$/, "Phone number must be between 10 and 15 digits, with an optional leading +."),
  ),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  // Supabase Auth does not expose a direct "get user by email" admin method in
  // this SDK version, so we scan the paginated admin list only when needed.
  // Registration is rare, so this is an acceptable fallback path.
  const pageSize = 1000;
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) break;

    const user = data.users.find((u) => u.email?.trim().toLowerCase() === email);
    if (user) return user;

    if (data.users.length < pageSize) break;
  }

  return null;
}

export async function POST(req: Request) {
  const parsed = await parseBody(req, RegisterSchema);
  if ("error" in parsed) return parsed.error;
  const { name, email, phone, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();

  const blocked = await checkIpRateLimit("REGISTER", req, { email });
  if (!blocked.allowed) {
    return fail("Unable to create account right now. Please try again.", 429);
  }

  // 1. Pre-check: Does a user with this email or phone already exist in our DB?
  // If the DB row is orphaned (auth user was deleted), clean it up and allow
  // registration to continue instead of blocking a valid new signup.
  const [existingUser] = await db
    .select({ id: users.id, email: users.email, phone: users.phone })
    .from(users)
    .where(
      sql`lower(${users.email}) = lower(${email}) OR ${users.phone} = ${phone}`
    )
    .limit(1);

  if (existingUser) {
    const { data: authData, error: authError } = await admin.auth.admin.getUserById(existingUser.id);
    if (!authError && authData.user) {
      if (existingUser.email.toLowerCase() === normalizedEmail) {
        return fail("An account with this email already exists. Please sign in instead.", 409);
      }
      return fail("An account with this phone number already exists.", 409);
    }

    // Stale DB row without a corresponding auth account. Remove it so the
    // user can create a fresh account with the same email/phone.
    await db.delete(users).where(sql`${users.id} = ${existingUser.id}`);
  }

  // 2. Create auth user (normal signup with publishable key)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_PUBLISHABLE_KEY!
  );

  // Derive the app's origin from the request so the redirect URL works in
  // both local dev (localhost:3000) and production without hardcoding.
  const origin = new URL(req.url).origin;

  const signUpResult = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  let authUser = signUpResult.data?.user ?? null;
  const signUpError = signUpResult.error;
  let shouldContinue = false;

  if (signUpError) {
    const message = signUpError.message.toLowerCase();
    console.error("[register] signUp error:", signUpError.status, signUpError.message);

    if (message.includes("already")) {
      const existingAuthUser = await findAuthUserByEmail(admin, normalizedEmail);
      if (existingAuthUser) {
        const [existingDbUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(sql`${users.id} = ${existingAuthUser.id}`)
          .limit(1);

        if (!existingDbUser) {
          console.warn("[register] deleting orphan auth user with no DB row:", existingAuthUser.id);
          await admin.auth.admin.deleteUser(existingAuthUser.id).catch(() => null);

          const retryResult = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, phone },
              emailRedirectTo: `${origin}/auth/callback`,
            },
          });

          if (retryResult.error) {
            console.error("[register] retry signUp failed:", retryResult.error.message);
            return fail("Unable to create account right now. Please try again.", 400);
          }

          authUser = retryResult.data?.user ?? null;
          if (!authUser || authUser.identities?.length === 0) {
            return fail("An account with this email already exists.", 409);
          }

          shouldContinue = true;
        } else {
          return fail("An account with this email already exists.", 409);
        }
      }

      console.warn("[register] signUp returned duplicate for email with no matching auth user:", normalizedEmail);

      const { data: fallbackData, error: fallbackError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: process.env.NEXT_PUBLIC_EMAIL_VERIFICATION !== "true",
        user_metadata: { name, phone },
      });

      if (fallbackError || !fallbackData.user) {
        console.error("[register] fallback createUser failed:", fallbackError?.message);
        return fail("Unable to create account right now. Please try again.", 400);
      }

      // Reuse the created auth user for the normal DB insert path below.
      authUser = fallbackData.user;
      shouldContinue = true;
    }
    if (message.includes("rate limit")) {
      return fail("Too many signup attempts. Please wait a few minutes before trying again.", 429);
    }

    if (!shouldContinue) {
      return fail("Unable to create account right now. Please try again.", 400);
    }
  }

  // Duplicate email with email-confirm OFF returns user but empty identities
  if (!authUser || authUser.identities?.length === 0) {
    return fail("An account with this email already exists.", 409);
  }

  const userId = authUser.id;

  // 2. Write user to our DB — role defaults to "customer", status to "active"
  try {
    await db.insert(users).values({
      id: userId,
      name,
      email,
      phone,
      role: "customer",
      status: "active",
    });
  } catch (dbError) {
    console.error("[register] DB insert failed:", dbError);

    const pgErr = dbError as { code?: string; constraint_name?: string; constraint?: string };
    const constraint = (pgErr.constraint_name ?? pgErr.constraint ?? "").toLowerCase();

    if (
      pgErr.code === "23505" &&
      (constraint.includes("users_pkey") || constraint.includes("users_email_key"))
    ) {
      return fail("An account with this email already exists. Please sign in instead.", 409);
    }

    // Roll back the auth user so there's no orphan
    await admin.auth.admin.deleteUser(userId).catch(() => null);
    return fail("Registration failed. Please try again.", 500);
  }

  return ok({
    id: userId,
    name,
    email,
    phone,
    role: "customer",
    needsEmailVerification: !signUpResult.data?.session,
  });
}
