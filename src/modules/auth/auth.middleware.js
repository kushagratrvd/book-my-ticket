import ApiResponse from "../../common/utils/api-response.js";
import ApiError from "../../common/utils/api-error.js"
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import { query } from "../../common/config/db.js"

const authenticate = async (req, res, next) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if(!accessToken) throw ApiError.unauthorized("Authentication Error");

    const decoded = verifyAccessToken(accessToken);
    const findUser = "select id, name, email from users where id = $1"
    const user = await query(findUser, [decoded.id]);
    if(user.rowCount === 0) throw ApiError.unauthorized("User not found");
    
    req.user = {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email
    };

    next();
}

export { authenticate }