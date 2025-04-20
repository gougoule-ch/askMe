import { PASSWORD } from '$env/static/private';

export default function login(request: Request): { error?: string; success: boolean } {
	const authorization = request.headers.get('Authorization');
	if (!authorization) {
		return {
			error: 'Authorization header is missing',
			success: false
		};
	}
	if (!authorization.startsWith('Bearer ')) {
		return {
			error: 'Authorization header should start with Bearer',
			success: false
		};
	}
	const token = authorization.substring(7);
	if (!token) {
		return {
			error: 'Token is missing',
			success: false
		};
	}
	if (token == PASSWORD) {
		return {
			success: true
		};
	}
	return {
		error: 'Invalid token',
		success: false
	};
}
