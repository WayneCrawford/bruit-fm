# Datasets open or available through BRUIT-FM
See the [map](https://www.bruit-fm.org/obs_networks/world_map_inventory.html) to explore open datasets.

# Recommended BRUIT-FM datasets (available through WP2)
Not yet selected.  Here are some possibilities:

| Name | Location | # stations (BB) | min/max freq (Hz) | Start | End | Availabilty | Access |
| ---- | -------- | --------------- | ----------------  | ---------- | -------- | ----------- | ------ |
| Gorda | NE Pacific | 40 (2) | 0.001/40 | 2013-10 | 2015-09 | open | Z5 (IRIS) |
| RHUM-RUM | Indian | 57 (57) | 0.001/50 | 2012-09 | 2013-11 | open | YV (RESIF) |
| MAYOBS  | Indian | 6-12 (1) | 0.1 /100 | 2019-02 | ongoing | private | 1T (mayobs.ipgp.fr) |
| EMSO-MOMAR | N Atlantic | 5 (1) | 0.001/50 | 2007-07 | ongoing | public | 4G (RESIF) |
| AlpArray | Ligurian Sea | 35 (35) | 0.001/40 | 2017-06 | 2018-02 | public starting April 2022 | Z3 (RESIF) |
| PiLAB | C Atlantic | 40 (40) | 0.001/40 | 2016-03 | 2017-03 | embargoed | XS (IRIS & Wayne?) |
| Ocean	Obs. Initiative | NE Atlantic | 7 (3) | 0.001/100 | 2014-08 | ongoing | public | OO (IRIS) |
| Cascadia | NE Pacific | ~60) | 0.01/50 | 2011-07 | 2015-10 | public | 7D (IRIS) |
| SEIS-ADELICE | Antarctica | 5(2) | 0.1/100 | 2022-02 | ongoing | embargoed| through Guilhem |
| AACSE | Alaska | 85 (?) | 0.01/100 | 2018-05 | 2019-09 | open| XO (IRIS) |
| NEAREST | Gulf of Cadiz | ?? | ?? | ?? | ?? | private| shared |

## Examples of data and metadata access using [obspy](https://github.com/obspy/obspy/wiki/)

### Getting station/channel information from an FDSN (RESIF, IRIS, mayobs.ipgp.fr...) site
In a first time, you can go to the [FDSN network website](http://www.fdsn.org/networks/), enter the network code and go to the linked site, which will usually have a map of the stations and basic information about the available channels/stations (look for "fedcatalog")

You can also get the information using python/obspy
```python
from obspy.clients.fdsn import Client
from obspy import UTCDateTime

client_address = 'IRIS'  # or "RESIF", or a private URL such as "mayobs.ipgp.fr", if you have access to it
net = 'Z5'
start_time = UTCDateTime('2013-10-01T')
end_time = UTCDateTime('2015-09-30T')
level = 'channel' # from least to most details: 'network', 'station', 'channel', 'response'

client = Client(client_address)
inventory = client.get_stations(network=net, starttime=start_time, endtime=end_time, level=level)
print(inventory)    # Writes basic information about stations to the screen
inventory.write('XO.info.txt', 'STATIONTXT', level=level)  # writes more detailed info to XO.info.txt
```

### Getting waveform data from an FDSN site
```python
from obspy.clients.fdsn import Client
from obspy.core import UTCDateTime

client_address = 'IRIS'
net = 'Z5'
sta = 'BB870'
loc = '*'
cha = 'B*'            # returns all channels starting with "B"
start_time = UTCDateTime('2014-08-01T')
end_time = UTCDateTime('2014-08-02T')

client = Client(client_address)
stream = client.get_waveforms(network=net, station=sta, channel=cha, location=loc,
                              starttime=start_time, endtime=end_time)
stream.plot()
# In case you prefer WAV data to seismological formats...
for trace in stream:
  trace.write(trace.id + '.wav', 'WAV')
```
