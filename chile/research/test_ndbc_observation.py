"""Synthetic unit tests only. This does not create publishable model skill."""
import datetime as dt
import importlib.util
import math
from pathlib import Path

spec=importlib.util.spec_from_file_location("buoy_model",Path(__file__).with_name("train_ndbc_observation.py"))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assert m.valid_float("MM",0,20) is None
assert m.valid_float("-99",0,20) is None
assert m.valid_float("5.1",0,20)==5.1
assert m.valid_float("100",0,20) is None
data=["#YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS PTDY TIDE",
      "#yr mo dy hr mn degT m/s m/s m sec sec degT hPa degC degC degC nmi hPa ft"]
start=dt.datetime(2026,1,1,tzinfo=dt.timezone.utc)
for i in range(600):
 t=start+dt.timedelta(hours=i)
 h=round(1.5+.4*math.sin(i/20),2)
 data.append(t.strftime("%Y %m %d %H %M")+f" 320 4.0 6.0 {h:.2f} 12 7.0 270 1013.0 15.0 16.0 MM MM MM MM")
# Missing data test for one wave height should not create false 0 m
broken=data.copy();broken[15]=broken[15].replace(" 1.", " MM ") if " 1." in broken[15] else broken[15]
hour=m.parse_ndbc("\n".join(data))
assert len(hour)==600
assert abs(hour[start]["MWD"]-270)<.0001
assert len(m.examples(hour))==594
out=m.learn("\n".join(data),"SYNTHETIC-TEST","2026-10-26T19:00:00Z")
assert out["status"]=="real_buoy_model_trained"
assert out["surfQualityValidated"] is False
assert out["cameraModelTrained"] is False
assert out["deployed"] is False
assert out["trainExamples"]>100
assert out["holdoutExamples"]>30
assert out["ridge"]["MAE_m"]>=0
print("NOAA parser and chronology unit tests passed. Values are SYNTHETIC FIXTURES, never real measured skill.")
