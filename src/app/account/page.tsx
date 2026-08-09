import { getAccountUser } from "@/lib/account";
import ProfileForm from "@/components/account/ProfileForm";

/**
 * Profile tab.
 *
 * Values are read on the server and passed straight in as the form's initial
 * state, so the fields are populated in the first paint rather than flashing
 * empty while a client fetch resolves.
 */
export default async function AccountProfilePage() {
  // The layout already established there's a session; `getAccountUser` is
  // memoised per request, so this reuses that result rather than re-querying.
  const account = await getAccountUser();
  if (!account) return null;

  return (
    <ProfileForm
      name={account.name ?? ""}
      email={account.email}
      initial={{
        phone: account.phone ?? "",
        parentName: account.parentName ?? "",
        city: account.city ?? "",
        age: account.age ?? 0,
      }}
    />
  );
}
