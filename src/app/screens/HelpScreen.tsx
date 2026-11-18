import '@features/help/styles/help.scss'
import { SCREEN } from 'app/utils/display';
import { useScreenAutoNavigate } from 'app/hooks';
import { useGameConfig } from '@tsukiweb/common/context';
import { useStrings } from 'translation/lang';
import HelpList from 'features/help/components/HelpList';


const HelpScreen = () => {
	useScreenAutoNavigate(SCREEN.HELP)
	const { imageSrc } = useGameConfig()
	const strings = useStrings()

	return (
		<div id="help">
			<img className="help-ciel" src={imageSrc("tachi/tiel_t04")} alt="" draggable={false} />
			<h2 className="help-logo">
				<img src={imageSrc("tachi/osiete")} alt={strings.extra.help} draggable={false} />
			</h2>
			<div className="help-scroll">
				<HelpList />
			</div>
		</div>
	)
}

export default HelpScreen
