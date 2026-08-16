import '@features/dreams/styles/dreams.scss'
import { useNavBackRef } from '@tsukiweb/common/hooks'
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import DreamsList from 'features/dreams/components/DreamsList';

function back() {
	(document.querySelector('#extra-dreams') as HTMLElement)?.focus()
}

const DreamsScreen = () => {
	useScreenAutoNavigate(SCREEN.DREAMS)

	return (
		<main className="page" id="dreams" ref={useNavBackRef(back)}>
			<DreamsList />
		</main>
	)
}

export default DreamsScreen