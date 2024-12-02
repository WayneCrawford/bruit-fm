from obspy.core.stream import read
from obspy import read_inventory, UTCDateTime
from obspy.signal import PPSD

# read the data
stream = read('XX.AS02.mseed')

# Cut deployment and recovery
stream.trim(starttime=UTCDateTime('2022-05-09T00'),
            endtime=UTCDateTime('2022-05-17T12'))

stream.plot(equal_scale=False)  # plots to screen for verification
stream.plot(equal_scale=False, outfile='plots/AS02.streamplot.png')

inv = read_inventory('AS02_L.station.xml')
ppsd = PPSD(stream.select(channel='LHZ')[0].stats, inv)
ppsd.add(stream)
ppsd.plot(period_lim=(1, 600))
ppsd.plot(period_lim=(1, 600), filename='plots/AS02.Z-PPSD.png')