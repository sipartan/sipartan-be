const password = (value, helpers) => {
    // Combine regex to check for at least one letter, one number, and one special character
    /**
     * (?=.*[a-zA-Z]): Ensures at least one letter.
     * (?=.*\d): Ensures at least one digit.
     * (?=.*[!@#$%^&*(),.?":{}|<>]): Ensures at least one special character.
     * [^\s]{8,}: Ensures a length of 8 or more characters and no spaces.
     */
    const regex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[^\s]{8,}$/;

    if (!regex.test(value)) {
        return helpers.message(
            'Password must be at least 8 characters long, include at least one letter, one number, one special character, and have no spaces'
        );
    }

    return value;
};

module.exports = {
    password,
};
