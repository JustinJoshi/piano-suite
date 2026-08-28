import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WaitlistCta } from "@/components/waitlist/waitlist-cta";

const joinWaitlist = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => joinWaitlist),
}));

const captureEvent = vi.fn();

vi.mock("@/lib/analytics", () => ({
  captureEvent: (...args: unknown[]) => captureEvent(...args),
}));

function typeEmail(value: string) {
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /join/i }));
}

describe("WaitlistCta", () => {
  beforeEach(() => {
    joinWaitlist.mockReset();
    joinWaitlist.mockResolvedValue({ status: "joined", position: 7 });
    captureEvent.mockClear();
  });

  it("renders headline, email input, and submit button", () => {
    render(<WaitlistCta />);

    expect(screen.getByText(/founding pro/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
  });

  it("shows the position after a successful join", async () => {
    render(<WaitlistCta />);

    typeEmail("me@example.com");
    submit();

    await waitFor(() => {
      expect(screen.getByText(/#7/i)).toBeInTheDocument();
    });
    expect(joinWaitlist).toHaveBeenCalledWith({
      email: "me@example.com",
      source: "pricing-page",
    });
  });

  it("emits pro_waitlist_click on submit", async () => {
    render(<WaitlistCta />);

    typeEmail("me@example.com");
    submit();

    await waitFor(() => {
      expect(captureEvent).toHaveBeenCalledWith("pro_waitlist_click", {
        source: "pricing-page",
      });
    });
  });

  it("shows the already-joined state for duplicate emails", async () => {
    joinWaitlist.mockResolvedValue({ status: "alreadyJoined", position: 3 });

    render(<WaitlistCta />);

    typeEmail("dupe@example.com");
    submit();

    await waitFor(() => {
      expect(screen.getByText(/already/i)).toBeInTheDocument();
      expect(screen.getByText(/#3/i)).toBeInTheDocument();
    });
  });

  it("shows an inline error and skips the mutation for bad emails", async () => {
    render(<WaitlistCta />);

    typeEmail("not-an-email");
    submit();

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(joinWaitlist).not.toHaveBeenCalled();
    expect(captureEvent).not.toHaveBeenCalled();
  });

  it("shows an error state when the mutation fails", async () => {
    joinWaitlist.mockRejectedValue(new Error("network down"));

    render(<WaitlistCta />);

    typeEmail("me@example.com");
    submit();

    expect(await screen.findByText(/try again/i)).toBeInTheDocument();
  });
});
