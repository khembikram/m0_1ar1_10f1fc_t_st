const Scene = require('Scene');
const Time = require('Time');

(async function () {
  
  const [hourHand, hourHandShadow, minuteHand, minuteHandShadow, secondHand, secondHandShadow] = await Promise.all([
    Scene.root.findFirst('hour'),
    Scene.root.findFirst('hourShadow'),
    Scene.root.findFirst('minute'),
    Scene.root.findFirst('minuteShadow'),
    Scene.root.findFirst('second'),
    Scene.root.findFirst('secondShadow')
  ]);
  
  const date = new Date();

  const startTime = (date.getHours() * 60 * 60) + (date.getMinutes() * 60) + date.getSeconds();
  const time = Time.ms.sub(Time.ms.pin()).div(1000).add(startTime);
  
  const hour = time.div(60*60);
  const minute = time.div(60);
  const second = time.mod(60);

  //calculate the angle for each hand
  const hourAngle = hour.mul(Math.PI/6).mul(-1);
  const minuteAngle = minute.mul(Math.PI/30).mul(-1);
  const secondAngle = second.floor().mul(Math.PI/30).mul(-1);
  
  hourHand.transform.rotationZ = hourAngle;
  hourHandShadow.transform.rotationZ = hourAngle;
  minuteHand.transform.rotationZ = minuteAngle;
  minuteHandShadow.transform.rotationZ = minuteAngle;
  secondHand.transform.rotationZ = secondAngle;
  secondHandShadow.transform.rotationZ = secondAngle;
  
})();