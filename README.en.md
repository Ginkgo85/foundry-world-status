# Foundry World Status

[Deutsch](README.md) | **English**

Version **1.2.0** · Foundry VTT **14.368** · GM-only controls · No module dependencies

**Status: Community Release / In Development**

This module is distributed via GitHub and is not listed in the official Foundry VTT package directory. Published packages are available on the GitHub Releases page.

Announce your game session as **ONLINE** or **OFFLINE** on Discord with one click, using a customizable message and a direct link to your Foundry game world.

[Continue working on a new PC](#continue-working-on-a-new-pc) – a simple guide to working on this project with Codex.

## Features

- Discord button in Foundry's left toolbar, visible only to GMs.
- Customizable Discord embeds with text, colors, images and a server link.
- Optional role mention for ONLINE announcements and a built-in connection test.
- Optional automatic OFFLINE announcement before returning to Setup.
- Settings and announcement status are stored per world; the webhook stays in the current browser.
- German and English interface with an optional local language preference for each user.

**ONLINE is announced manually by a GM.** There is no automatic availability check or message when the world starts. ON/OFF shows the saved announcement status.

## Installation

The permanent manifest link installs the latest published release. A new version becomes available through this link only after it is published.

1. In Foundry Setup, open **Add-on Modules → Install Module**.
2. Copy and paste this manifest link, then install:

   ```text
   https://github.com/Ginkgo85/foundry-world-status/releases/latest/download/module.json
   ```

3. Open your world and enable the module under **Settings → Manage Modules**, then reload the world.

Alternatively, download the [ZIP for v1.2.0](https://github.com/Ginkgo85/foundry-world-status/releases/download/v1.2.0/foundry-world-status.zip) (available after publication) and extract it into `Data/modules/foundry-world-status/`. `module.json` is at the ZIP root and must end up directly inside the module folder. Restart Foundry or reload its modules afterward.

For a manual update, back up the existing module folder and replace it with the new ZIP contents. **Do not delete world data.**

## Language

The module interface supports **German and English**. By default, **Automatic** follows Foundry's active interface language. Other Foundry languages use Foundry's English fallback.

In Foundry's standard module settings, choose **Foundry World Status → Language / Sprache**, select **Automatic**, **Deutsch** or **English**, and save. This preference applies only to your user in this world and browser. Other GMs and players are unaffected, even when they use another Foundry user on the same PC. A different browser starts with Automatic again.

Open module windows and the button tooltip update without reloading the world. Unsaved input is preserved. If saving or a connection test is in progress, window labels update the next time you open it at the latest.

**Your saved Discord texts are never translated or overwritten.** Only defaults that have not yet been saved may follow the selected language. Changing language sends no Discord message and changes neither the webhook nor the ON/OFF status. Players can select their language; Discord controls remain GM-only.

## Quick start

1. In Discord, open **Edit Channel → Integrations → Webhooks → New Webhook** in the desired text channel and copy the webhook URL.
2. In Foundry's module settings, open **Foundry World Status → Configure World Status for Discord**.
3. Enter the **Discord Webhook URL** and the **Foundry Server URL / Custom Domain** that your players can reach.
   The eye button temporarily reveals the webhook URL; it is hidden again when you reopen the window.
4. Customize the message. The ONLINE link display text is optional: with text, that text becomes the link; without it, the server URL is displayed. An explicitly saved empty field stays empty. **Test Discord Connection** sends a real test message without changing ON/OFF status.
5. Click **Save Settings** and use the Discord button in the left toolbar.

For a role mention, enter the numeric Discord role ID. Only that role may be mentioned in ONLINE announcements; `@everyone`, `@here` and user mentions are blocked. Discord permissions still apply.

## Settings preview

![Preview of the module settings](https://raw.githubusercontent.com/Ginkgo85/foundry-world-status/main/docs/images/settings-connection.png)

<details>
<summary>Show another preview</summary>

![Another preview of the module settings](https://raw.githubusercontent.com/Ginkgo85/foundry-world-status/main/docs/images/settings-offline.png)

</details>

*These images are previews and may differ from the current version. The screenshots show the German interface.*

## The ON/OFF button

The Discord logo always stays white and keeps its original proportions. Only the separate status text and border use status colors.

| Display | Clicking it |
| --- | --- |
| <img src="icons/discord-off.svg" width="40" height="40" alt="White Discord logo with red OFF status"> **OFF** | Sends the ONLINE message and changes to ON after confirmation and saving. |
| <img src="icons/discord-on.svg" width="40" height="40" alt="White Discord logo with green ON status"> **ON** | Sends the OFFLINE message and changes to OFF. |

If OFFLINE sending is disabled, clicking ON only resets the status to OFF. The button appears at the end of the current tool group; a scene must be active and the toolbar must be open.

With multiple GMs, one person should handle announcements. The send lock applies per browser and does not prevent simultaneous messages from different GM sessions.

## Automatic OFFLINE announcements

Under **OFFLINE Message**, enable both options and save:

- **Send an OFFLINE Message to Discord**
- **Announce OFFLINE before Return to Setup**

When the saved status is ON, the message is sent before the attempt to close the world through **Return to Setup**. This feature is off by default. A sending or storage error stops the operation.

**Logging out does not change the shared status. Closing the browser or tab, crashes and stopping the server are not detected.** If closing the world fails after the announcement, the world may still be running despite OFF. This option does not confirm an actual server shutdown; manually announcing OFF before ending the world remains the simplest alternative.

## Security and help

Keep webhook URLs secret and never publish them on GitHub. The webhook is stored **only in the current browser**, separately for each world and GM. Other browsers or devices need their own setup. Clearing browser data also removes the local webhook.

Client storage is not a secret vault. The password field masks the URL but does not encrypt it. Scripts, extensions or people with access to the same browser profile can read local storage. Use separate browser profiles for GMs and players.

<details>
<summary>Keep existing settings</summary>

The module ID remains `foundry-world-status`; message texts and world status are preserved. A previously shared webhook is copied to local storage when a GM starts the world or opens the settings. The copy is checked before the shared value is removed. Ideally, only one GM should be logged in during this step. Other GM browsers must then be configured separately.

If storage fails, the previous copy is kept; reopen the settings after fixing the problem. If the local and shared webhooks differ, nothing is overwritten. Sign in as the same GM using a fresh browser profile and open the settings to copy the shared value there. The first browser keeps its different value. Do not clear browser data beforehand.

The older `foundry-discord-announcer` installation is not automatically migrated or modified. When switching, install the new module separately, disable the old one in the world, and manually transfer settings and the webhook as GM. Do not run both modules at the same time.

Migration cannot retract webhooks already shared or stored in backups. Replace a previously exposed webhook in Discord.

</details>

- [Changelog](CHANGELOG.md) · The project includes a validation report and development instructions in `VALIDIERUNG.md` and `CONTRIBUTING.md` (German).
- [Report a bug](https://github.com/Ginkgo85/foundry-world-status/issues) – do not include webhook URLs or private world data.

For **CORS/network errors**, remember that the GM's browser sends directly to Discord, even when Foundry runs in Docker. Sending form data avoids an additional JSON OPTIONS preflight; the response must still be readable through CORS. Browser extensions, DNS, TLS or a Content Security Policy can block the connection. Try another browser to narrow down the cause. Before sending again, check the Discord channel to avoid duplicate messages.

After a partial save failure, the local webhook may already have changed. Check the Foundry connection and save again.

## Continue working on a new PC

The complete project, including program files, tests and instructions, is on [GitHub](https://github.com/Ginkgo85/foundry-world-status). You do not need to know Git.

1. Open Codex on your new Windows PC. You need **Git for Windows** and **GitHub CLI**. Codex can help set them up.
2. Sign in to GitHub once through your browser as **Ginkgo85**, or use your own account when working on your own copy. Codex can guide you.
3. Ask Codex to download the complete project. You can copy this request:

   ```text
   Download Ginkgo85/foundry-world-status from GitHub onto this PC.
   First check whether Git and GitHub CLI are set up, and help me
   install them and sign in to GitHub if needed.
   Read AGENTS.md and the other project instructions first.
   Set up the testing tools according to those instructions.
   Do not change project files or publish anything yet.
   ```

4. Open the downloaded **foundry-world-status** folder as a project in Codex. Then simply describe what you want to change. Codex handles tests, saving changes as commits, uploading them to GitHub (pushing), and checking GitHub's automatic checks according to the project rules.

**Publishing a version later:** First ask Codex to prepare the new version and finish the checks. Test the module as described in `PUBLISHING.md`. Then, on GitHub, select **Actions → Release → Run workflow** and choose **main**. GitHub creates the package automatically.

## License and author

[MIT License](LICENSE) · Copyright (c) 2026 Ginkgo85 · [Ginkgo85 / Project page](https://github.com/Ginkgo85/foundry-world-status)

Discord and the Discord logo are trademarks of Discord Inc. This module is not affiliated with or endorsed by Discord Inc. Foundry Virtual Tabletop and its associated trademarks belong to Foundry Gaming LLC; this module is not an official Foundry Gaming product.
