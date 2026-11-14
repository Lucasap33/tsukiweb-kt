import '@features/title-menu/styles/daily-messages.scss'
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import DailyMessagesList from 'features/title-menu/components/DailyMessagesList';


const DailyMessagesScreen = () => {
	useScreenAutoNavigate(SCREEN.DAILY_MESSAGES)

	return (
		<div id="daily-messages">
			<DailyMessagesList />
		</div>
	)
}

export default DailyMessagesScreen
