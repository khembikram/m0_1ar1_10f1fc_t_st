/**
 * (c) Meta Platforms, Inc. and its affiliates. Confidential and proprietary.
*/
const R = require('Reactive');
const S = require('Scene');
const B = require('Blocks');
const D = require('Diagnostics');
const T = require('Time');
const WT = require('WorldTracking');
const LE = require('LightingEstimation');
const I = require('Instruction');
const CI = require('CameraInfo');
const P = require('Patches');
const TG = require('TouchGestures');

const INSTANTIATION_ROOT = 'trackingVizRoot';
const BLOCK_ASSET = 'trackingViz';

class TrackingViz {
  constructor() {
    Promise.all([
      S.root.findFirst(INSTANTIATION_ROOT),
      S.root.findFirst('trackerInstruction'),
      P.outputs.getBoolean('planeFound'),
    ]).then(e=>{
      this.trackingVizRoot = e[0];
      this.trackerInstruction = e[1];
      this.planeFound = e[2];
      this.initAfterPromiseResolved();
    }).catch(e=>{
      D.log(e.stack);
    });
  }

  initAfterPromiseResolved(){
    this.monitorWorldTrackingStatus();
    this.subscribeTrackableAdded();
    this.subscribeTrackableDeleted();

  }

  subscribeTrackableAdded(){
    WT.onTrackableAdded().subscribe(trackable=> {
      // D.log('[TrackingViz] Trackable added: '+trackable.id.pinLastValue());
      this.instantiateBlock(trackable);
    });
  }

  instantiateBlock(trackable) {
    B.instantiate(BLOCK_ASSET, {}).then(newBlock=>{
      // D.log('[TrackingViz] Block instantiated');
      let brightness = LE.frameBrightness;

      this.trackingVizRoot.addChild(newBlock).then(() => {
        newBlock.inputs.setColor('GridColor', R.RGBA(255, 255, 255, brightness.mul(.6)));
        newBlock.inputs.setColor('CrossColor', R.RGBA(255, 255, 255, brightness.mul(2)));
      }).catch(e=>{
        D.log(e.stack);
      });

      // Hide for a short delay to avoid pop
      newBlock.hidden = true;
      T.setTimeout(() => {
        newBlock.hidden = false;
      }, 100);

      newBlock.transform.position = trackable.transform.applyToPoint(trackable.center);
      newBlock.transform.rotation = trackable.transform.rotation;
      newBlock.transform.scaleX = trackable.extent.x;
      newBlock.transform.scaleZ = trackable.extent.z;
    }).catch(e=>{
      D.log('[TrackingViz] '+e.stack);
    });
  }

  subscribeTrackableDeleted(){
    WT.onTrackableDeleted().subscribe(trackable=> {
      // D.log('[TrackingViz] Trackable deleted');
      this.destroyBlock(trackable);
    });
  }

  destroyBlock(trackable){
    this.trackingVizRoot.findFirst(trackable.id.pinLastValue()).then(e=>{
      S.destroy(e);
    }).catch(e=>{
      // D.log(e.stack);
    });
  }

  monitorWorldTrackingStatus(){
    WT.state.monitor({fireOnInitialValue: true}).subscribe( WTState => {
      // D.log("[TrackingViz] WT.state: " + WTState.newValue);
      if (WTState.newValue == 'NOT_AVAILABLE'){
        this.setInstruction(true, 'slowly_move_your_phone');
      } else if (WTState.newValue == 'TRACKING'){
        this.setInstruction(true, 'tap_to_place');
        TG.onTap().subscribe((gesture) => {
          if (this.planeFound.pinLastValue()){
            this.setInstruction(false, '');
          }
        });
      }
    });
  }

  setInstruction(enabled, token){
    let frontCameraSignal = CI.captureDevicePosition.eq("FRONT");
    I.bind(frontCameraSignal.or(enabled), frontCameraSignal.ifThenElse('flip_camera', token));
    let hideTrackerAnim = token != 'slowly_move_your_phone' || frontCameraSignal;
    this.trackerInstruction.inputs.setBoolean('hidden', hideTrackerAnim);
  }
}

const trackingViz = new TrackingViz();
export default trackingViz;
