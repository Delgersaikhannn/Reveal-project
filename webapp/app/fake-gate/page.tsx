import { redirect } from "next/navigation";

/**
 * Redirect /fake-gate to /fake-gate/index.html (static page in public).
 * Next.js serves public/fake-gate/index.html at /fake-gate/index.html.
 */
export default function FakeGatePage() {
  redirect("/fake-gate/index.html");
}
