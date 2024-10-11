import { BlueishTheme } from "./blueish_theme.ts";
import { DefaultTheme } from "./default_theme.ts";
import { ThemeOptions } from "./options.ts";

export const Themes: { [name:string]: ThemeOptions } = {
    default: DefaultTheme,
    blueish: BlueishTheme
}