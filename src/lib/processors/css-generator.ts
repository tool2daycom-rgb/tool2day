export type CssPreset = "button" | "gradient" | "shadow" | "card" | "input";

export type CssOptions = {
  preset: CssPreset;
  color: string;
  color2: string;
  radius: number;
  shadow: number;
  text: string;
};

export const cssPresets: Array<{ id: CssPreset; label: string }> = [
  { id: "button", label: "زر Button" },
  { id: "gradient", label: "تدرج Gradient" },
  { id: "shadow", label: "ظل Shadow" },
  { id: "card", label: "بطاقة Card" },
  { id: "input", label: "حقل إدخال Input" },
];

export function buildCss(o: CssOptions): { css: string; previewStyle: string } {
  const r = `${o.radius}px`;
  const sh = `0 ${Math.max(2, o.shadow)}px ${o.shadow * 3}px rgba(0,0,0,${Math.min(0.45, 0.08 + o.shadow / 80)})`;

  if (o.preset === "gradient") {
    const css = `.gradient-box {
  background: linear-gradient(135deg, ${o.color} 0%, ${o.color2} 100%);
  border-radius: ${r};
  padding: 2rem;
  color: #fff;
  font-weight: 700;
  text-align: center;
  box-shadow: ${sh};
}`;
    return {
      css,
      previewStyle: `background:linear-gradient(135deg,${o.color},${o.color2});border-radius:${r};padding:2rem;color:#fff;font-weight:700;text-align:center;box-shadow:${sh}`,
    };
  }

  if (o.preset === "shadow") {
    const css = `.shadow-box {
  background: #ffffff;
  border-radius: ${r};
  padding: 1.5rem;
  box-shadow: ${sh};
}`;
    return {
      css,
      previewStyle: `background:#fff;border-radius:${r};padding:1.5rem;box-shadow:${sh}`,
    };
  }

  if (o.preset === "card") {
    const css = `.card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: ${r};
  padding: 1.25rem 1.5rem;
  box-shadow: ${sh};
}
.card h3 {
  margin: 0 0 0.5rem;
  color: ${o.color};
}
.card p {
  margin: 0;
  color: #555;
  line-height: 1.7;
}`;
    return {
      css,
      previewStyle: `background:#fff;border:1px solid #e8e8e8;border-radius:${r};padding:1.25rem 1.5rem;box-shadow:${sh}`,
    };
  }

  if (o.preset === "input") {
    const css = `.field {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: ${r};
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field:focus {
  border-color: ${o.color};
  box-shadow: 0 0 0 3px ${o.color}33;
}`;
    return {
      css,
      previewStyle: `width:100%;border:1px solid #ddd;border-radius:${r};padding:0.75rem 1rem;font-size:0.95rem;box-shadow:0 0 0 3px ${o.color}33;border-color:${o.color}`,
    };
  }

  // button
  const css = `.btn {
  display: inline-block;
  background: ${o.color};
  color: #fff;
  border: none;
  border-radius: ${r};
  padding: 0.75rem 1.4rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: ${sh};
  transition: transform 0.15s, filter 0.15s;
}
.btn:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}`;
  return {
    css,
    previewStyle: `display:inline-block;background:${o.color};color:#fff;border:none;border-radius:${r};padding:0.75rem 1.4rem;font-weight:700;box-shadow:${sh}`,
  };
}
