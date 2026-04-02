/**
 * proxy.ts — server-side request handler utilities.
 * API routes import these to validate input, build consistent responses,
 * and handle errors in one place.
 */

import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

export type ApiSuccess<T> = { data: T };
export type ApiError = { error: string };

/** Return a 200 JSON success response. */
export function ok<T>(data: T): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status: 200 });
}

/** Return a JSON error response with the given status code. */
export function fail(message: string, status = 400): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status });
}

/** Parse and validate a JSON request body against a Zod schema. */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse<ApiError> }> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return { error: fail("Invalid JSON body.") };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    const message = formatZodError(result.error);
    return { error: fail(message) };
  }

  return { data: result.data };
}

function formatZodError(err: ZodError): string {
  return err.errors.map((e) => e.message).join(", ");
}
