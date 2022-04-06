# Data and metadata access using [obspy](https://github.com/obspy/obspy/wiki/)

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
