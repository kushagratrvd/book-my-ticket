import { query } from "../../common/config/db.js"
import * as jwt from "../../common/utils/jwt.utils.js"
import crypto from "crypto"
//import { sendMail, sendVerificationEmail } from "../../common/config/email.js";
import ApiError from "../../common/utils/api-error.js";

const hashed = function(token){
    return crypto.createHash("sha256").update(token).digest("hex")
}

const register = async ({ name, email, password }) => {

    if(!email, !password){
        throw new ApiError.badRequest("email, and password is required")
    }

    const findUser = "select email from users where email = $1";
    let user = await query(findUser, [email]);
    if(user.rowCount > 0){
        console.log("Existing user found: ", user.rows[0]);
        throw ApiError.conflict("email already exists, please login")
    }

    //const { rawToken, hashedToken } = jwt.generateResetToken();
    // send email with rawToken
    
    password = hashed(password);
    try{
        const q = `
        insert into users (name, email, password)
        values ($1, $2, $3)
        returning *`;
        const result = await query(q, [name, email, password]);
        const userObj = result.rows[0];
        delete userObj.password;

        return userObj;
    }
    catch (ex) {
        console.error(ex);
        throw ApiError.badRequest(ex);
    }
}

const login = async ({ email, password }) => {
    if(!email || !password) throw ApiError.badRequest("Email, and password is required");

    const findUser = "select id, name, email, password from users where email = $1"; 
    const result = await query(findUser, [email]);
    if(result.rowCount === 0) throw ApiError.unauthorized("Invalid Email or Password");
    const user = result.rows[0];

    if(hashed(password) !== user.password) throw ApiError.badRequest("password doesn't match");

    //if(!user.is_verified) throw ApiError.forbidden("please verify before login");

    const accessToken = jwt.generateAccessToken({ id: user.id });
    const refreshToken = jwt.generateRefreshToken({ id: user.id });

    const hashedRefreshToken = hashed(refreshToken);
    
    try {
        const saveUser = `update users set refresh_token = $2 where email = $1 returning *`;
        const resultSaveUser = await query(saveUser, [email, hashedRefreshToken])
        if(resultSaveUser.rowCount === 0) throw ApiError.badRequest("Something went wrong while trying to login");

        const userObj = resultSaveUser;
        delete userObj.password;
        delete userObj.refresh_token;

        return { user: userObj, accessToken, refreshToken }
    } catch (error) {
        throw ApiError.badRequest(error);
    }
    
}

const refresh = async (token) => {
    if(!token) throw ApiError.badRequest("missing token");
    
    const decoded = jwt.verifyRefreshToken(token);

    const userQuery = "select id, refresh_token from users where id = $1"
    const result = await query(userQuery, [decoded.id]);
    if(result.rowCount === 0) throw ApiError.unauthorized("user not found");
    const user = result.rows[0];

    if(hashed(token) !== user.refresh_token) throw ApiError.unauthorized("wrong token, get lost");

    const accessToken = jwt.generateAccessToken({id: user.id});
    const refreshToken = jwt.generateRefreshToken({id: user.id});
    const hashedRefreshToken = hashed(refreshToken);

    try {
        const saveUser = "update users set refresh_token = $2 where id = $1 returning *";
        const resultSaveUser = await query(saveUser, [decoded.id, hashedRefreshToken]);

        return {accessToken, refreshToken}
    } catch (error) {
        throw ApiError.badRequest(error);
    }

}

const logout = async (userId) => {
    await query("update users set refresh_token = null where id = $1", [userId]);
}

const resetPassword = async (token, newPassword) => {
    const hashedToken = hashed(token);
    const user = await token.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPassword   Expires")

    if(!user) ApiError.unauthorized("Incorrect credentials");
    //if(user.resetPasswordExpires < Date.now()) ApiError.forbidden("Unauthorized");

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    
}

const forgotPassword = async (email) => {
    const user = await email.findOne(email);
    if(!user) throw ApiError.notFound("email not found");

    const { rawToken, hashedToken } = jwt.generateResetToken;
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save({validateBeforeSave: false});

    //send email
    try {
        const to = email;
        const subject = "You Forgot Password Token";
        const html = `Here's you forgot password token: ${rawToken}`;
        sendMail(to, subject, html);
    } catch (error) {
        console.log("error while sending forgot password token", error)
    }
}

const getMe = async (userId) => {
    const user = await query("select name, email from users where id = $1", [userId])
    if(user.rowCount === 0) ApiError.unauthorized("User not found");
    return user.rows[0];
}

export { register, login, logout, refresh, resetPassword, forgotPassword, getMe }