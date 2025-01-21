const password = (value, helpers) => {
    /**
     * Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, one special character, and have no spaces.
     * ^ : Start of string.
     * (?=.*[A-Z]) : Ensure string has at least one uppercase letter.
     * (?=.*[a-z]) : Ensure string has at least one lowercase letter.
     * (?=.*\d) : Ensure string has at least one digit.
     * (?=.*[\W_]) : Ensure string has at least one special character.
     * [^\s]{8,} : Ensure string has at least 8 characters with no spaces.
     * $ : End of string.
     */
    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[^\s]{8,}$/;

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
