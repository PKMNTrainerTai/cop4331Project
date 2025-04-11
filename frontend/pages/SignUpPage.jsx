import React from 'react';
import SignUp from '../components/SignUp';

const SignUpPage = () => {
    const handleSignUp = (username, password, email) => {
        console.log("user tried to make username", username);
        console.log("user tried to make password", password);
        console.log("user tried to make email", email);
    }

    return (
        <div>
            <SignUp onSubmit={handleSignUp} />
        </div>
    )


}

export default SignUpPage;