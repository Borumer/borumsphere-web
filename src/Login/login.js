import { useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import AccountForm from "../AccountForm/accountForm";
import login from "../AccountForm/accountForm.module.css";
import FormField from "../FormField/formField";
import Layout from "../Layout/layout";
import { CONFIRMED_STATE } from "../lib/states";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const history = useHistory("");
	const location = useLocation();

	useEffect(() => {
		document.title = "Login - Borum Sphere";
	}, []);



	const handleLogin = (e, setConfirmed, setErrorMessage) => {
		const handleErr = err => {
			let { message } = err;

			if (err.name !== 'Error') {
				message =
					"A system error occurred and you could not be logged in at this time. Please try again another time.";
			}

			console.error(err);
			setErrorMessage(message);
			setConfirmed(CONFIRMED_STATE.FAILURE);
		};

		const urlSearch = new URLSearchParams(location.search);
		const redirect = decodeURIComponent(urlSearch.get('redirect'));
		
		const redirectDomain = redirect.includes('https') ? redirect.substring("https://".length) : redirect.substring("http://".length);
		let apiPath = "https://api.borumtech.com/api/login";
		let redirectPath = redirect;

		if (redirect.includes('localhost')) {
			console.info(redirectDomain);
			const firstIndex = 'localhost:'.length;
			console.log(firstIndex);
			let redirectPort = redirectDomain.substring(firstIndex);
			if (redirectDomain.includes('/'))
				redirectPort = redirectDomain.substring(firstIndex, redirectDomain.indexOf('/'));

			let apiPort = redirectPort + 5000;
			console.log(redirectPort);

			apiPath = `localhost:${apiPort}/v1/login`;
		}

		apiPath = redirectDomain + "/v1/login";

		// Add user to specific Borum app's database's users table
		fetch(`https://api.${redirect ? apiPath : ordinaryApiPath}`, {
			method: "POST",
			headers: {
				"content-type": "application/x-www-form-urlencoded",
			},
			body: `email=${email}&password=${password}`,
		})
			.then(response => {
				if (response.ok) {
					return response.json();
				} else if (response.status === 401) {
					throw new Error(
						"The email or password you entered was incorrect. Please try again."
					);
				} else {
					throw new Error(
						"A system error occurred and you could not be logged in at this time"
					);
				}
			})
			.then(response => {
				setConfirmed(CONFIRMED_STATE.SUCCESS);
				localStorage.setItem("id", response.data.id);
				localStorage.setItem("email", email);
				localStorage.setItem("firstName", response.data.first_name);
				localStorage.setItem("lastName", response.data.last_name);
				localStorage.setItem("apiKey", response.data.api_key);

				if (redirect) {
					// Allow application to store user credentials, but send API key securely
					fetch(`${redirect}/api/authorize`, {
						method: 'post',
						headers: {
							'content-type': 'application/x-www-form-urlencoded'
						},
						body: `authorization=${response.data.api_key}`
					}).then(response => {
						if (response.ok) {
							window.location.assign(redirect);
						}
					}).catch(err => { 
						handleErr(err); 
						window.location.assign(redirect) 
					});
				} else history.push("/account");
			})
			.catch(handleErr);
	};

	return (
		<Layout>
			<AccountForm
				heading="Login into Borum"
				formProps={{ method: "post" }}
				handleSubmit={handleLogin}
				failedAction=" and you could not be logged in"
			>
				<FormField
					autofocus
					label="email"
					format="email"
					required
					value={email}
					onChange={e => setEmail(e.target.value)}
				/>
				<FormField
					label="password"
					format="password"
					required
					value={password}
					onChange={e => setPassword(e.target.value)}
				/>
				<a target="_blank" rel="noreferrer" href="/forgot-password">
					Forgot password? Reset it
				</a>
				<Link to="/signup">Don't have an account yet? Register</Link>
				<button type="submit" className={login.card}>
					Login
				</button>
			</AccountForm>
		</Layout>
	);
}
