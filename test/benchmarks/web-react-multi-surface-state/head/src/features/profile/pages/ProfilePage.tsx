import { saveWorkspaceChanges } from "../../workspace/services/saveWorkspaceChanges";

export function ProfilePage() {
  return (
    <section>
      <button data-testid="profile-save" onClick={saveWorkspaceChanges}>
        Save profile
      </button>
      <p>Profile saved</p>
    </section>
  );
}
