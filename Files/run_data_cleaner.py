#! /usr/bin/env python3
# -*- coding: utf-8 -*-
import numpy as np
from obspy.core.stream import read
from obspy.core.inventory import read_inventory

from tiskit import CleanRotator, SpectralDensity, DataCleaner
from trace_compare import TraceCompare

# SET PARAMETERS
infiles = ['XS.S11D.LH.2016.12.11.mseed']
window_s = 2*1024  # Window length in seconds
# CleanRotator parameters
rotate_band = (0.003, 0.02)  # freq band in which to calculate rotate angle
# DataCleaner Parameters
dc_kwargs = {'max_freq': 0.1, 'window_s': window_s, 'show_progress': False}
dc_tforder = ('*1', '*2', '*H')


for infile in infiles:
    stream = read(infile, 'MSEED')
    inv_decim = read_inventory('stations_PILAB_S_decimated.xml', 'STATIONXML')
    sta = stream[0].stats.station
    seed_id = stream[0].get_id()[:-5]
    print(f'Working on {sta=}, {seed_id=}')

    print('Plotting AutoSpectral Density Functions')
    sd = SpectralDensity.from_stream(stream, window_s, inv=inv_decim)
    sd.plot(overlay=True)

    print('Running simple rotator')
    rotator = CleanRotator(stream, filt_band=rotate_band,
                           verbose=False, uselogvar=False)
    stream_rot = rotator.apply(stream)
    print(rotator)

    print('Running DataCleaner on unrotated and rotated data')
    dc = DataCleaner(stream, dc_tforder, **dc_kwargs)
    dc_rot = DataCleaner(stream_rot, dc_tforder, **dc_kwargs)
    # dc.plot()
    # dc_rot.plot()

    print('Correcting data streams using DataCleaners)')
    stream_dced_td = dc.clean_stream(stream, in_time_domain=True)
    stream_rot_dced_td = dc_rot.clean_stream(stream_rot, in_time_domain=True)
    stream_dced_fd = dc.clean_stream(stream, in_time_domain=False)
    stream_rot_dced_fd = dc_rot.clean_stream(stream_rot, in_time_domain=False)

    print('Comparing the PSDs of the different streams')
    tc = TraceCompare(
        [[stream.select(channel='*Z')[0], 'original', 'grey', '-'],
         [stream_rot.select(channel='*Z')[0], 'simple rotation', 'grey', '--'],
         [stream_dced_td.select(channel='*Z')[0], 'orig+clean_td', 'blue', '-'],
         [stream_rot_dced_td.select(channel='*Z')[0], 'rot+clean_td', 'blue', '--'],
         [stream_dced_fd.select(channel='*Z')[0], 'orig+clean_fd', 'red', '-'],
         [stream_rot_dced_fd.select(channel='*Z')[0], 'rot+clean_fd', 'red', '--']])
    tc.plot_psds(inv=inv_decim, title=seed_id+f'{window_s:.0f}s',
                 outfile=f'{seed_id}_{window_s:.0f}s_streamPSD.png', show=True)

    print('Calculating PSD of the best combo')
    sd_best = SpectralDensity.from_stream(stream_rot, window_s=2048,
                                          data_cleaner=dc_rot)
    print('Z PSD min = {:.1f}'.format(
          10*np.log10(np.min(sd_best.autospect("XS.S11D..LHZ-1-2-H")))))
    sd_best.plot_one_autospectra(
        'XS.S11D..LHZ-1-2-H', outfile=f'{seed_id}_{window_s:.0f}s_directPSD.png')
