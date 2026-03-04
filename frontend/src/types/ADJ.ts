import { Board } from "./Board";
import { GeneralInfo } from "./GeneralInfo";

export type ADJ = {
    general_info: GeneralInfo;
    board_list: Record<string, string>;
    boards: Board[];
};
