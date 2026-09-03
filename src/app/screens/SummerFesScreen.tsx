import '@features/summer-fes/styles/summer-fes.scss'
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import SummerFesList from 'features/summer-fes/components/SummerFesList';


const SummerFesScreen = () => {
	useScreenAutoNavigate(SCREEN.SUMMER_FES)

	return (
		<div id="summer-fes">
			<SummerFesList />
		</div>
	)
}

export default SummerFesScreen