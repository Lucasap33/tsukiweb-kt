import '@features/dreams/styles/dreams.scss'
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import DreamsList from 'features/dreams/components/DreamsList';


const DreamsScreen = () => {
	useScreenAutoNavigate(SCREEN.DREAMS)

	return (
		<div id="dreams">
			<DreamsList />
		</div>
	)
}

export default DreamsScreen