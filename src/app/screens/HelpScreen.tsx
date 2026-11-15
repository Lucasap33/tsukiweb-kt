import '@features/help/styles/help.scss'
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import HelpList from 'features/help/components/HelpList';


const HelpScreen = () => {
	useScreenAutoNavigate(SCREEN.HELP)

	return (
		<div id="help">
			<HelpList />
			{
				//TODO guide flowcharts ?
			}
		</div>
	)
}

export default HelpScreen