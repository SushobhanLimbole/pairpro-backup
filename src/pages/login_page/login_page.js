import { signInWithEmailAndPassword } from 'firebase/auth';
import styles from './login_page.module.css';
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from '../../utils/firebase';

const Login = () => {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const storedEmail = localStorage.getItem('userEmail');
        const storedPassword = localStorage.getItem('userPassword');
        if (storedEmail && storedPassword) {
            navigate("/home", { state: { email: storedEmail } });
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // Store email and password in localStorage
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userPassword', password);
            // Send displayName (username) to home
            const displayName = userCredential.user.displayName || email;
            navigate("/home", { state: { displayName } });
        } catch (error) {
            console.error("Error logging in:", error.message);
            setError(error.message);
        }
    };

    return (
        <section className={styles.loginPage}>
            <div className={styles.loginContainer}>
                <h2>Login</h2>
                <form className={styles.loginForm} onSubmit={handleLogin}>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.inputField}
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.inputField}
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    <button type="submit" className={styles.loginButton} >Login</button>
                </form>
                <div style={{ marginTop: '1.5rem' }}>
                    <span>Don't have an account? </span>
                    <Link to="/signup" style={{ color: 'red', fontWeight: 600, textDecoration: 'underline', marginLeft: 4 }}>Sign up</Link>
                </div>
            </div>
        </section>
    );
};

export default Login;
