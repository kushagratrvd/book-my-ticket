import ApiResponse from "../../common/utils/api-response.js";
import * as authService from "./auth.services.js"


const register = async (req, res) => {
    const user = await authService.register(req.body);
    ApiResponse.created(res, "Registration is successfull", user)
}

const login = async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 //7 days
    });

    ApiResponse.created(res, "Login Successful", { user, accessToken });
};

const logout = async (req, res) => {
    await authService.logout(req.user.id)
    res.clearCookie("refreshToken");
    ApiResponse.ok(res, "Logged out");
}

const refresh = async (req, res) => {
    const { accessToken, refreshToken } = await authService.refresh(req.cookies.refreshToken);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60,
    });

    ApiResponse.created(res, "Tokens refreshed", accessToken);
}

const verifyEmail = async (req, res) => {
    //const token = req.headers.authorization?.split(" ")[1];
    const user = await authService.verifyEmail(req.params.token);
    ApiResponse.created(res, "Email Verified", user);
}

const resetPassword = async (req, res) => {
    //const token = req.headers.authorization?.split(" ")[1];
    await authService.resetPassword(req.params.token, req.body.password);
    ApiResponse.ok(res, "Password resetted");
}

const forgotPassword = async (req, res) => {
    await authService.forgotPassword(req.email);
    ApiResponse.ok(res, "Reset Password link sent to mail");
}

const getMe = async (req, res) => {
    const user = await authService.getMe(req.user.id);
    ApiResponse.ok(res, "Profile", user);
}

export { register, login, logout, refresh, verifyEmail, resetPassword, forgotPassword, getMe }