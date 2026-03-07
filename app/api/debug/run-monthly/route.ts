import { createBookingSession } from "@/app/actions/billing/createBookingSession";

export async function GET() {

  try {

    console.log("===== RUNNING DEBUG BOOKING SESSION =====");

    const result = await createBookingSession({
      organizationId: "49c3ef02-cb09-4fde-82d8-2012e5945ba2",
      tenantId: "ed1807c2-67ae-4957-bcb9-1b3cd6041f54",
      kitchenSpaceId: "424272ec-c597-474f-abac-a6c58640c962",
      bookings: [
        {
          startTime: "2026-03-06T10:00:00Z",
          endTime: "2026-03-06T14:00:00Z",
        },
        {
          startTime: "2026-03-07T13:30:00Z",
          endTime: "2026-03-07T18:00:00Z",
        },
        {
          startTime: "2026-03-12T07:00:00Z",
          endTime: "2026-03-12T12:00:00Z",
        },
        {
          startTime: "2026-03-13T11:00:00Z",
          endTime: "2026-03-13T15:30:00Z",
        },
        {
          startTime: "2026-03-14T08:00:00Z",
          endTime: "2026-03-14T12:00:00Z",
        },
        {
          startTime: "2026-03-15T08:00:00Z",
          endTime: "2026-03-15T12:00:00Z",
        },
        {
          startTime: "2026-03-27T10:30:00Z",
          endTime: "2026-03-27T14:30:00Z",
        },
        {
          startTime: "2026-03-28T11:30:00Z",
          endTime: "2026-03-28T15:30:00Z",
        },
      ],
    });

    console.log("===== DEBUG RESULT =====", result);

    return Response.json({
      success: true,
      result
    });

  } catch (error) {

    console.error("===== DEBUG ERROR =====", error);

    return Response.json(
      {
        success: false,
        error
      },
      { status: 500 }
    );
  }
}