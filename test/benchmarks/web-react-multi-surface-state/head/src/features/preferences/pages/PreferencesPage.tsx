import { saveWorkspaceChanges } from "../../workspace/services/saveWorkspaceChanges";

export function PreferencesPage() {
  return (
    <section>
      <button data-testid="preferences-save" onClick={saveWorkspaceChanges}>
        Save preferences
      </button>
      <p>Preferences saved</p>
    </section>
  );
}
