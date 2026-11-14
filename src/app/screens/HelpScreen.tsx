import '@features/dreams/styles/dreams.scss'
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import HelpList from 'features/help/components/HelpList';


const HelpScreen = () => {
	useScreenAutoNavigate(SCREEN.DREAMS)

	return (
		<div id="dreams">
			<HelpList />
			{
				//TODO guide flowcharts ?
			}
		</div>
	)
}

export default HelpScreen