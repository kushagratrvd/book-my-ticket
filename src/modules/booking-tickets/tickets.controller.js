import ApiResponse from "../../common/utils/api-response.js";
import * as ticketService from "./tickets.services.js"


const getTickets = async (req, res) => {
  const tickets = await ticketService.getTickets(req.user.id);
  ApiResponse.ok(res, "Fetched tickets successfully", tickets)
}

const deleteTicket = async (req, res) => {
    await ticketService.deleteTicket(req.ticket_id);
    ApiResponse.ok(res, "ticket deleted");
}


export { getTickets, deleteTicket } 