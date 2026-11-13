import { Composition } from "remotion";
import { BookPromo } from "./BookPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SpeakingMatrixPromo"
      component={BookPromo}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
