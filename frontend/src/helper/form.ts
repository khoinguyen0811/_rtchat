function resetForm(element: HTMLFormElement) {
  // tìm tất cả input, textarea, select trong element
  const inputs = element.querySelectorAll('input, textarea, select') as NodeListOf<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  
  inputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      (input as HTMLInputElement).checked = false; // bỏ chọn checkbox/radio
    } else {
      (input as HTMLInputElement).value = ''; // reset value
    }
  });
}

export default resetForm;
