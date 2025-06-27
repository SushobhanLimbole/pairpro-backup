import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import styles from './signup_page.module.css'
import { auth } from "../../utils/firebase";

const Signup = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();



    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // Set displayName (name) for the user
            await updateProfile(userCredential.user, { displayName: username });
            // Store email and password in localStorage
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userPassword', password);
            // Send displayName (username) to home
            navigate("/home", { state: { displayName: username } });
        } catch (err) {
            console.error("Error signing up:", err.message);
            setError(err.message);
        }
    };

    return (

        <section className={styles.signupPage}>
            <div className={styles.signupContainer}>
                <h2 className={styles.signupTitle}>Signup</h2>
                <form className={styles.signupForm} onSubmit={handleSignup}>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.inputField}
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.inputField}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.inputField}
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.signupButton}>Signup</button>
                </form>
                <div style={{ marginTop: '1.5rem' }}>
                    <span>Already have an account? </span>
                    <a href="/" style={{ color: '#45b6f3', fontWeight: 600, textDecoration: 'underline', marginLeft: 4 }}>Login</a>
                </div>
            </div>
        </section>
    );
};

export default Signup;
