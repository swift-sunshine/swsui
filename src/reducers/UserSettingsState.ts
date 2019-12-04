import { getType } from 'typesafe-actions';
import { UserSettings } from '../store/Store';
import { config } from '../config';
import { updateState } from '../utils/Reducer';
import { KialiAppAction } from '../actions/KialiAppAction';
import { UserSettingsActions } from '../actions/UserSettingsActions';

export const INITIAL_USER_SETTINGS_STATE: UserSettings = {
  duration: config.toolbar.defaultDuration,
  interface: { navCollapse: false },
  refreshInterval: config.toolbar.defaultRefreshInterval,
  replayActive: false,
  replayOffset: 0
};

const UserSettingsState = (state: UserSettings = INITIAL_USER_SETTINGS_STATE, action: KialiAppAction): UserSettings => {
  switch (action.type) {
    case getType(UserSettingsActions.navCollapse):
      return updateState(state, {
        interface: { navCollapse: action.payload.collapse }
      });
    case getType(UserSettingsActions.setDuration):
      return updateState(state, {
        duration: action.payload
      });
    case getType(UserSettingsActions.setRefreshInterval): {
      return updateState(state, {
        refreshInterval: action.payload
      });
    }
    case getType(UserSettingsActions.setReplayOffset): {
      return updateState(state, {
        replayOffset: action.payload
      });
    }
    case getType(UserSettingsActions.toggleReplayActive): {
      return updateState(state, {
        replayActive: !state.replayActive,
        replayOffset: 0
      });
    }
    default:
      return state;
  }
};

export default UserSettingsState;
