import { adaptHotkey } from "siyuan";

export interface IDockData {
  text: string;
}

export const CustomContentMobile = (title: string, data: IDockData) => `
    <div>
      <div class="toolbar toolbar--border toolbar--dark">
        <svg class="toolbar__icon"><use xlink:href="#iconEmoji"></use></svg>
        <div class="toolbar__text">${title}</div>
      </div>
      <div class="fn__flex-1 plugin-sample__custom-dock">${data.text}</div>
    </div>
`;

export const CustomContent = (title: string, data: IDockData) => `
    <div class="fn__flex-1 fn__flex-column">
      <div class="block__icons">
        <div class="block__logo">
          <svg class="block__logoicon"><use xlink:href="#iconEmoji"></use></svg>${title}
        </div>
        <span class="fn__flex-1 fn__space"></span>
        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw"aria-label="Min ${adaptHotkey(
          "⌘W"
        )}"
          ><svg><use xlink:href="#iconMin"></use></svg></span>
      </div>
      <div class="fn__flex-1 plugin-sample__custom-dock">${data.text}</div>
    </div>
`;
