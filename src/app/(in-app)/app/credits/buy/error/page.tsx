import CreditsErrorRedirector from "./CreditsErrorRedirector";

export default async function CreditsErrorPage() {
  // The error handling is done in the client component
  // This allows us to access URL parameters easily
  return <CreditsErrorRedirector />;
}
