console.log("AUTH YÜKLENDİ");

const form = document.getElementById("register-form");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    console.log("Email:", email);
    console.log("Şifre:", password);

    alert("Form çalışıyor!");
});
