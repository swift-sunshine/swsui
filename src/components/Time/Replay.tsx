import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { KialiAppState } from 'store/Store';
import DatePicker from 'react-datepicker';
import { replayWindowSelector, replayQueryTimeSelector, durationSelector } from 'store/Selectors';
import { Tooltip, ButtonVariant, Button, Text } from '@patternfly/react-core';
import { TimeInSeconds, IntervalInSeconds, ReplayWindow, DurationInSeconds } from 'types/Common';
import ToolbarDropdown from 'components/ToolbarDropdown/ToolbarDropdown';
import { UserSettingsActions } from 'actions/UserSettingsActions';
import { KialiAppAction } from 'actions/KialiAppAction';
import Slider from 'components/IstioWizards/Slider/Slider';
import { KialiIcon, defaultIconStyle } from 'config/KialiIcon';
import { style } from 'typestyle';
import { toString } from './LocalTime';
import { DurationDropdownContainer } from 'components/DurationDropdown/DurationDropdown';
import { serverConfig } from 'config';
import { PfColors } from 'components/Pf/PfColors';

type ReduxProps = {
  duration: DurationInSeconds;
  replayQueryTime: TimeInSeconds;
  replayWindow: ReplayWindow;

  setReplayQueryTime: (replayQueryTime: TimeInSeconds) => void;
  setReplayWindow: (replayWindow: ReplayWindow) => void;
  toggleReplayActive: () => void;
};

type ReplayProps = ReduxProps & {
  id: string;
};

type ReplayState = {
  isReplaying: boolean;
  refresherRef?: number;
  replayFrame: number;
  replayFrameCount: number;
  replaySpeed: number;
};

type ReplaySpeed = {
  speed: IntervalInSeconds;
  text: string;
};

export const ReplayColor = PfColors.LightBlue200;

// key represents replay interval in seconds
const replayIntervals = {
  60: '1 minute',
  300: '5 minutes',
  600: '10 minutes',
  1800: '30 minutes'
};

// key represents refresh interval in seconds
const replaySpeeds: ReplaySpeed[] = [
  { speed: 5, text: 'slow' },
  { speed: 3, text: 'medium' },
  { speed: 1, text: 'fast' }
];

const defaultReplayInterval = 300; // 5 minutes
const defaultReplaySpeed = 3; // medium
const frameInterval = 10; // number of seconds clock advances per frame

const replayStyle = style({
  display: 'flex',
  width: '100%'
});

const frameStyle = style({
  display: 'flex',
  margin: '5px 0 0 15px'
});

const startTimeStyle = style({
  height: '36px',
  paddingLeft: '.75em',
  width: '12em'
});

const pauseStyle = style({
  margin: '-5px 10px 0 30%',
  height: '37px',
  width: '10px'
});

const stopStyle = style({
  height: '37px',
  width: '10px'
});

const sliderStyle = style({
  width: '100%',
  margin: '0 -10px 0 20px'
});

const speedStyle = style({
  height: '1.5em',
  width: '4em',
  margin: '1px 0 0 0',
  padding: '0 2px 2px 2px'
});

const speedFocusStyle = style({
  backgroundColor: ReplayColor
});

export class Replay extends React.PureComponent<ReplayProps, ReplayState> {
  static getFrameCount = (replayInterval: IntervalInSeconds): number => {
    return replayInterval > 0 ? Math.floor(replayInterval / frameInterval) : 0;
  };

  static queryTimeToFrame = (props: ReduxProps): number => {
    const elapsedTime: IntervalInSeconds = props.replayQueryTime - props.replayWindow.startTime;
    const frame: number = Replay.getFrameCount(elapsedTime);
    return frame;
  };

  static frameToQueryTime = (frame: number, props: ReduxProps): TimeInSeconds => {
    const queryTime: TimeInSeconds = props.replayWindow.startTime + frame * frameInterval;
    return queryTime;
  };

  private pickerTime: TimeInSeconds = 0;

  constructor(props: ReplayProps) {
    super(props);
    this.state = {
      isReplaying: false,
      refresherRef: undefined,
      replayFrame: Replay.queryTimeToFrame(props),
      replayFrameCount: Replay.getFrameCount(props.replayWindow.interval),
      replaySpeed: defaultReplaySpeed
    };
  }

  componentDidMount() {
    if (!!!this.props.replayWindow.startTime) {
      const startTime = Math.floor(Date.now() / 1000) - defaultReplayInterval;
      this.setReplayWindow({ interval: defaultReplayInterval, startTime: startTime });
    }
  }

  componentDidUpdate(_: ReplayProps, prevState: ReplayState) {
    let refreshChange = this.state.isReplaying !== prevState.isReplaying;
    refreshChange = refreshChange || this.state.replaySpeed !== prevState.replaySpeed;

    if (refreshChange) {
      this.updateRefresher();
    }
  }

  componentWillUnmount() {
    if (this.state.refresherRef) {
      clearInterval(this.state.refresherRef);
    }
  }

  render() {
    if (!!!this.props.replayWindow.startTime) {
      return null;
    }

    const selectedTime = new Date(this.props.replayWindow.startTime * 1000);
    const endTime: TimeInSeconds = this.props.replayWindow.startTime + this.props.replayWindow.interval;
    const ticks: number[] = Array.from(Array(this.state.replayFrameCount).keys());
    const endString = toString(endTime * 1000, { month: undefined, day: undefined, second: '2-digit' });
    const now = Date.now();
    const maxTime: Date = new Date(now - 1000 * this.props.replayWindow.interval);
    const minTime: Date = new Date(
      now - 1000 * (serverConfig.prometheus.storageTsdbRetention! + this.props.replayWindow.interval)
    );

    return (
      <div className={replayStyle}>
        <Tooltip content="Replay start time">
          <DatePicker
            className={startTimeStyle}
            dateFormat="MMM dd, hh:mm aa"
            injectTimes={[maxTime]}
            maxDate={maxTime}
            maxTime={maxTime}
            minDate={minTime}
            minTime={minTime}
            onCalendarClose={() => this.onPickerClose()}
            onCalendarOpen={() => this.onPickerOpen()}
            onChange={date => this.onPickerChange(date)}
            popperPlacement="auto-end"
            selected={selectedTime}
            showTimeSelect={true}
            timeCaption="time"
            timeFormat="hh:mm aa"
            timeIntervals={5}
          />
        </Tooltip>
        <ToolbarDropdown
          id={'replay-interval'}
          handleSelect={key => this.setReplayInterval(Number(key))}
          value={String(this.props.replayWindow.interval)}
          label={replayIntervals[this.props.replayWindow.interval]}
          options={replayIntervals}
          tooltip="Replay length"
        />
        <DurationDropdownContainer id={'replay-duration'} tooltip={'Metrics per frame'} prefix=" " />
        <span className={sliderStyle}>
          <Slider
            key={endString} // on new endTime force new slider because of bug updating tick labels
            id="replay-slider"
            orientation="horizontal"
            min={0}
            max={this.state.replayFrameCount}
            maxLimit={this.state.replayFrameCount}
            step={1}
            value={this.state.replayFrame}
            ticks={ticks}
            tooltip={true}
            tooltipFormatter={this.formatTooltip}
            onSlideStop={this.setFrame}
            input={false}
            locked={false}
            showLock={false}
          />
          <span className={frameStyle}>
            {this.state.isReplaying ? (
              <Tooltip key="replay-pause" position="top" content="Pause">
                <Button className={pauseStyle} variant={ButtonVariant.link} onClick={this.pause}>
                  <KialiIcon.PauseCircle className={defaultIconStyle} />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip key="replay-play" position="top" content="Play">
                <Button className={pauseStyle} variant={ButtonVariant.link} onClick={this.play}>
                  <KialiIcon.PlayCircle className={defaultIconStyle} />
                </Button>
              </Tooltip>
            )}
            <Text style={{ margin: '1px 15px 0 0' }}>{this.formatFrame(this.state.replayFrame)}</Text>
            {replaySpeeds.map(s => this.speedButton(s))}
          </span>
        </span>
        <Tooltip key="end_replay" position="top" content="Close Replay">
          <Button className={stopStyle} variant={ButtonVariant.link} onClick={this.stop}>
            <KialiIcon.Close />
          </Button>
        </Tooltip>
      </div>
    );
  }

  formatTooltip = (val: number): string => {
    const time: string = toString(Replay.frameToQueryTime(val, this.props) * 1000, { second: '2-digit' });
    return `${time} [${val}/${this.state.replayFrameCount}]`;
  };

  formatFrame = (val: number): string => {
    const elapsedTime: TimeInSeconds = val * frameInterval;
    const elapsedSec: number = Math.floor(elapsedTime % 60);
    const elapsedMin: number = Math.floor((elapsedTime - elapsedSec) / 60);
    const zeroPadSec: string = elapsedSec < 10 ? '0' : '';
    const zeroPadMin: string = elapsedMin < 10 ? '0' : '';
    const elapsed: string = `${zeroPadMin}${elapsedMin}:${zeroPadSec}${elapsedSec}`;
    return `${elapsed}`;
  };

  private setReplayStartTime = (startTime: TimeInSeconds) => {
    this.setReplayWindow({ interval: this.props.replayWindow.interval, startTime: startTime });
  };

  private onPickerChange = (startTime: Date) => {
    this.pickerTime = startTime.getTime() / 1000;
  };

  private onPickerClose = () => {
    if (this.pickerTime !== this.props.replayWindow.startTime) {
      this.setReplayStartTime(this.pickerTime);
    }
  };

  private onPickerOpen = () => {
    this.pickerTime = this.props.replayWindow.startTime;
  };

  private setReplayInterval = (interval: IntervalInSeconds) => {
    this.setReplayWindow({ interval: interval, startTime: this.props.replayWindow.startTime });
  };

  private setReplayWindow = (replayWindow: ReplayWindow) => {
    const frameCount = Replay.getFrameCount(replayWindow.interval);
    this.setState({ replayFrame: 0, replayFrameCount: frameCount });
    this.props.setReplayWindow(replayWindow);
  };

  private setReplaySpeed = (replaySpeed: number) => {
    this.setState({ replaySpeed: replaySpeed });
  };

  private pause = () => {
    this.setState({ isReplaying: false });
  };

  private play = () => {
    this.setState({ isReplaying: true });
    const frameTime = Replay.frameToQueryTime(this.state.replayFrame, this.props);
    if (frameTime !== this.props.replayQueryTime) {
      this.props.setReplayQueryTime(frameTime);
    }
  };

  private stop = () => {
    this.props.toggleReplayActive();
  };

  private setFrame = (frame: number) => {
    if (frame !== this.state.replayFrame) {
      this.setState({ replayFrame: frame });
      this.props.setReplayQueryTime(Replay.frameToQueryTime(frame, this.props));
    }
  };

  private updateRefresher = () => {
    if (this.state.refresherRef) {
      clearInterval(this.state.refresherRef);
    }
    if (!this.state.isReplaying || !!!this.props.replayWindow.interval) {
      return;
    }

    let refresherRef: number | undefined = undefined;
    refresherRef = window.setInterval(this.handleRefresh, this.state.replaySpeed * 1000);
    this.setState({ refresherRef: refresherRef });
  };

  private handleRefresh = () => {
    const nextFrame = this.state.replayFrame + 1;
    if (nextFrame > this.state.replayFrameCount) {
      this.pause();
    } else {
      this.setState({ replayFrame: nextFrame });
      this.props.setReplayQueryTime(Replay.frameToQueryTime(nextFrame, this.props));
    }
  };

  private speedButton = (replaySpeed: ReplaySpeed): React.ReactFragment => {
    const isFocus = this.state.replaySpeed === replaySpeed.speed;
    const className = isFocus ? `${speedStyle} ${speedFocusStyle}` : `${speedStyle}`;
    return (
      <Button
        className={className}
        variant={ButtonVariant.plain}
        isFocus={isFocus}
        onClick={() => this.setReplaySpeed(replaySpeed.speed)}
      >
        {replaySpeed.text}
      </Button>
    );
  };
}

const mapStateToProps = (state: KialiAppState) => ({
  duration: durationSelector(state),
  replayQueryTime: replayQueryTimeSelector(state),
  replayWindow: replayWindowSelector(state)
});

const mapDispatchToProps = (dispatch: ThunkDispatch<KialiAppState, void, KialiAppAction>) => ({
  setReplayQueryTime: bindActionCreators(UserSettingsActions.setReplayQueryTime, dispatch),
  setReplayWindow: bindActionCreators(UserSettingsActions.setReplayWindow, dispatch),
  toggleReplayActive: bindActionCreators(UserSettingsActions.toggleReplayActive, dispatch)
});

const ReplayContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Replay);

export default ReplayContainer;
