import { ExtensionContext, TextDocumentShowOptions, Uri, commands } from "vscode";
import { kxbookLogViewType } from "./logview/logview-editor";
import { hasMinimumxbookVersion } from "../xbook/version";
import { kxbookEvalLogFormatVersion } from "./xbook/xbook-constants";
import { xbookViewManager } from "./logview/logview-view";
import { withEditorAssociation } from "../core/vscode/association";


export function activateOpenLog(
  context: ExtensionContext,
  viewManager: xbookViewManager
) {

  context.subscriptions.push(commands.registerCommand('xbook.openLogViewer', async (uri: Uri) => {

    // function to open using defualt editor in preview mode
    const openLogViewer = async () => {
      await commands.executeCommand(
        'vscode.open',
        uri,
        <TextDocumentShowOptions>{ preview: true }
      );
    };

    if (hasMinimumxbookVersion(kxbookEvalLogFormatVersion)) {
      if (uri.path.endsWith(".eval")) {

        await openLogViewer();

      } else {

        await withEditorAssociation(
          {
            viewType: kxbookLogViewType,
            filenamePattern: "{[0-9][0-9][0-9][0-9]}-{[0-9][0-9]}-{[0-9][0-9]}T{[0-9][0-9]}[:-]{[0-9][0-9]}[:-]{[0-9][0-9]}*{[A-Za-z0-9]{21}}*.json"
          },
          openLogViewer
        );

      }

      // notify the logs pane that we are doing this so that it can take a reveal action
      await commands.executeCommand('xbook.logListingReveal', uri);
    } else {
      await viewManager.showLogFile(uri, "activate");
    }

  }));

}