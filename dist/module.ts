import CacheFriendlyOpenTSDBDatasource from './datasource';
import {CacheFriendlyOpenTSDBQueryCtrl} from './query_ctrl';
import {CacheFriendlyOpenTSDBConfigCtrl} from './config_ctrl';

class CacheFriendlyOpenTSDBAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export {
  CacheFriendlyOpenTSDBDatasource as Datasource,
  CacheFriendlyOpenTSDBQueryCtrl as QueryCtrl,
  CacheFriendlyOpenTSDBConfigCtrl as ConfigCtrl,
  CacheFriendlyOpenTSDBAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};
