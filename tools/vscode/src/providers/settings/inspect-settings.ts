import { workspace } from "vscode";

// xbook Settings
export interface xbookSettings {
  notifyEvalComplete: boolean;
}
export type xbookLogViewStyle = "html" | "text";

// Settings namespace and constants
const kxbookConfigSection = "xbook";
const kxbookConfigNotifyEvalComplete = "notifyEvalComplete";

// Manages the settings for the xbook extension
export class xbookSettingsManager {
  constructor(private readonly onChanged_: (() => void) | undefined) {
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(kxbookConfigSection)) {
        // Configuration for has changed
        this.settings_ = undefined;
        if (this.onChanged_) {
          this.onChanged_();
        }
      }
    });
  }
  private settings_: xbookSettings | undefined;

  // get the current settings values
  public getSettings(): xbookSettings {
    if (!this.settings_) {
      this.settings_ = this.readSettings();
    }
    return this.settings_;
  }

  // write the notification pref
  public setNotifyEvalComplete(notify: boolean) {
    const configuration = workspace.getConfiguration(kxbookConfigSection,);
    void configuration.update(kxbookConfigNotifyEvalComplete, notify, true);
  }


  // Read settings values directly from VS.Code
  private readSettings() {
    const configuration = workspace.getConfiguration(kxbookConfigSection);
    const notifyEvalComplete = configuration.get<boolean>(kxbookConfigNotifyEvalComplete);
    return {
      notifyEvalComplete: notifyEvalComplete !== undefined ? notifyEvalComplete : true
    };
  }

}