import "@shoelace-style/shoelace/dist/components/alert/alert.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import type { SlAlert } from "@shoelace-style/shoelace";
import "@shoelace-style/shoelace/dist/themes/light.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
setBasePath("/node_modules/@shoelace-style/shoelace/dist");

export type ToastVariant =
  | "primary"
  | "success"
  | "neutral"
  | "warning"
  | "danger";

const VARIANT_ICON_MAP: Record<ToastVariant, string> = {
  primary: "info-circle",
  success: "check2-circle",
  neutral: "gear",
  warning: "exclamation-triangle",
  danger: "exclamation-octagon",
};

export class ToastService {
  static show(
    message: string,
    variant: ToastVariant = "primary",
    duration = 3000
  ) {
    const alert = document.createElement("sl-alert") as SlAlert;

    alert.variant = variant;
    alert.duration = duration;
    alert.closable = true;

    alert.innerHTML = `
      <sl-icon slot="icon" name="${VARIANT_ICON_MAP[variant]}"></sl-icon>
      <strong>${message}</strong>
    `;

    document.body.append(alert);
    alert.toast();
  }
}
