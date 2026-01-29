import { SimpleBoardForm } from '../components/SimpleBoardForm';
import { GeneralInfoForm } from '../components/GeneralInfoForm';
import { useADJState } from '../store/ADJStore';
import { Board, BoardName, BoardInfo } from '../types/Board';

interface Props {
    selectedSection: string;
    setSelectedSection: (section: string) => void;
}

export const Content = ({ selectedSection, setSelectedSection }: Props) => {
    const { config } = useADJState();

    if (!config) {
        return <div>No configuration loaded</div>;
    }

    if (selectedSection === 'general_info') {
        return <GeneralInfoForm />;
    } else {
        const selectedBoard = config.boards.find(
            (board: Board) => Object.keys(board)[0] === selectedSection,
        ) as Board;
        
        if (!selectedBoard) {
            return <div>Board not found</div>;
        }
        
        const selectedBoardName = Object.keys(selectedBoard)[0] as BoardName;
        const selectedBoardInfo = selectedBoard[selectedBoardName] as BoardInfo;

        return (
                <SimpleBoardForm
                    boardName={selectedBoardName}
                    boardInfo={selectedBoardInfo}
                    setSelectedSection={setSelectedSection}
                />
        );
    }
};
