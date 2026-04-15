import ApiError from "../../common/utils/api-error.js";
import { query } from "../../common/config/db.js"

const getTickets = async(userid) => {
  const tickets = await query("select * from tickets where user_id = $1", [userid]);
  return tickets;
}

const deleteTicket = async(ticketid) => {
  try {
    await query("begin");

    const updateSeatQuery = "Update seats set isbooked = 0 where ticket_id = $1";
    await query(updateSeatQuery, [ticketid]);

    const deleteTicketQuery = "delete from tickets where id = $1"
    const result = await query(deleteTicketQuery, [ticketid]);

    if(result.rowCount === 0){
      throw ApiError("ticket not found");
    }

    await query("commit");
  } catch (error) {
    await query("rollback")
    throw ApiError("ticket deletion failed")
  }
}

export { getTickets, deleteTicket }