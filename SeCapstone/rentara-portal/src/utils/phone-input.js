/** Shared phone contract: optional blank, otherwise exactly eleven ASCII digits. */
export function configurePhoneInputs(root) {
  root.querySelectorAll('input[type="tel"], input[name="phone"], input[name="emergencyContactPhone"]').forEach(input => {
    input.type = "tel";
    input.inputMode = "numeric";
    input.pattern = "[0-9]{11}";
    input.minLength = 11;
    input.maxLength = 11;
    input.title = "Enter exactly 11 digits, for example 09123456789";
    input.placeholder ||= "09123456789";
    input.addEventListener("beforeinput", event => {
      if (event.data && /[^0-9]/.test(event.data) && !event.isComposing) event.preventDefault();
    });
    input.addEventListener("paste", event => {
      const text = event.clipboardData?.getData("text");
      if (text === undefined) return;
      const length = input.value.length - ((input.selectionEnd ?? 0) - (input.selectionStart ?? 0)) + text.length;
      if (/[^0-9]/.test(text) || length > 11) {
        event.preventDefault();
        input.setCustomValidity("Paste an 11-digit number using digits only.");
        input.reportValidity();
        input.setCustomValidity("");
      }
    });
  });
}
