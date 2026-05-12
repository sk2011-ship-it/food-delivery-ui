# Sunmi Setup

## Required environment variables

Add these to `.env.local`:

```bash
SUNMI_APP_ID=your_app_id_here
SUNMI_APP_KEY=your_app_key_here
SUNMI_CALLBACK_URL=https://your-domain.com/api/sunmi/callback
```

## API routes added

- `POST /api/sunmi/bind`
- `POST /api/sunmi/push`
- `POST /api/sunmi/status`
- `POST /api/sunmi/unbind`
- `GET /api/sunmi/callback`

## Database table

This integration expects a `sunmi_printers` table that stores:

- `restaurantId`
- `shopId`
- `printerMsn`

## Flow

1. Bind the printer to a restaurant.
2. Save the mapping in the database.
3. After payment success, call the push endpoint.
4. Sunmi calls the callback route to fetch receipt content.
5. The callback returns ESC/POS text for printing.
