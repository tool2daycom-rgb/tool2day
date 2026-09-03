/** Adsterra units for tool2day.com */

export const ADSTERRA_SMARTLINK =
  "https://www.profitableratecpmnetwork.com/b7qah9pqh6?key=c50846ac7a2758dce54ea919e0adbaf4";

export const ADSTERRA_POPUNDER =
  "https://pl31169706.profitableratecpmnetwork.com/f9/91/98/f99198479532ab98297cb3dc1f136d03.js";

export const ADSTERRA_SOCIAL_BAR =
  "https://pl31169707.profitableratecpmnetwork.com/3a/84/91/3a8491fddd69b5e5c4893b1bfc56f39e.js";

export const ADSTERRA_NATIVE = {
  script:
    "https://pl31169708.profitableratecpmnetwork.com/e5d355bdbb241bdb7501771cf30671d5/invoke.js",
  containerId: "container-e5d355bdbb241bdb7501771cf30671d5",
} as const;

export const ADSTERRA_BANNERS = {
  "300x250": {
    key: "7c64b679a98324217d11c6b49f86cf26",
    width: 300,
    height: 250,
  },
  "468x60": {
    key: "acb99fa59f0bce503334090524179945",
    width: 468,
    height: 60,
  },
  "160x300": {
    key: "a1e193f5e4f51a2dedeefcfc075f0025",
    width: 160,
    height: 300,
  },
  "160x600": {
    key: "811c5c2074df003e62f0a2c0975c8a05",
    width: 160,
    height: 600,
  },
  "320x50": {
    key: "d1a4f9f3640ba7b79fc9175e8bf23a4d",
    width: 320,
    height: 50,
  },
  "728x90": {
    key: "bb2474372e9289e3d0a54b8f6c79f7ff",
    width: 728,
    height: 90,
  },
} as const;

export type AdsterraBannerSize = keyof typeof ADSTERRA_BANNERS;
