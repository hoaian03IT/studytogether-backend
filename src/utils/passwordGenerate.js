function generatePassword() {
    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const characters = ".!@#$%&";
    const numbers = "0123456789";

    const rdUpperCase = upperCase[Math.floor(Math.random() * upperCase.length)];
    const rdLowerCase = lowerCase[Math.floor(Math.random() * lowerCase.length)];
    const rdCharacter = characters[Math.floor(Math.random() * characters.length)];
    const rdNumber = numbers[Math.floor(Math.random() * numbers.length)];

    let password = rdUpperCase + rdLowerCase + rdCharacter + rdNumber;
    for (let i = 0; i < 8; i++) {
        password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    }

    return password;
}

module.exports = { generatePassword };
